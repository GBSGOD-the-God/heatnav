<?php
/**
 * Studentify API — shared bootstrap.
 *
 * DO NOT put credentials in this file (it gets overwritten on every re-upload).
 * Instead, create api/config.local.php ON THE SERVER once, containing:
 *
 *   <?php
 *   $DB_HOST = 'localhost';
 *   $DB_NAME = 'u123456789_studentify';
 *   $DB_USER = 'u123456789_admin';
 *   $DB_PASS = 'your-database-password';
 *   $GOOGLE_CLIENT_ID = ''; // optional: xxxx.apps.googleusercontent.com
 *
 *   // Email verification. Set to false while your site has no working
 *   // email sending (e.g. on a temporary *.hostingersite.com subdomain) —
 *   // accounts then activate instantly (email domains are still DNS-checked).
 *   $REQUIRE_EMAIL_VERIFICATION = true;
 *
 *   // Reliable mail via SMTP (recommended once you have a domain +
 *   // an email account, e.g. Hostinger: smtp.hostinger.com, port 465):
 *   $SMTP_HOST = '';
 *   $SMTP_PORT = 465;
 *   $SMTP_USER = ''; // e.g. noreply@yourdomain.com
 *   $SMTP_PASS = '';
 *
 * Tables are created automatically on first use.
 */

declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

$DB_HOST = 'localhost';
$DB_NAME = '';
$DB_USER = '';
$DB_PASS = '';
$GOOGLE_CLIENT_ID = '';
$REQUIRE_EMAIL_VERIFICATION = true;
$SMTP_HOST = '';
$SMTP_PORT = 465;
$SMTP_USER = '';
$SMTP_PASS = '';

$localConfig = __DIR__ . '/config.local.php';
if (file_exists($localConfig)) {
    require $localConfig;
}

function respond(int $code, array $data): void
{
    http_response_code($code);
    echo json_encode($data);
    exit;
}

function db(): PDO
{
    global $DB_HOST, $DB_NAME, $DB_USER, $DB_PASS;
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }
    if ($DB_NAME === '' || $DB_USER === '') {
        respond(500, [
            'error' => 'server-not-configured',
            'message' => 'Create api/config.local.php with your MySQL credentials (see api/config.php for the template).',
        ]);
    }
    try {
        $pdo = new PDO(
            "mysql:host=$DB_HOST;dbname=$DB_NAME;charset=utf8mb4",
            $DB_USER,
            $DB_PASS,
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );
    } catch (Throwable $e) {
        respond(500, ['error' => 'db-connect', 'message' => 'Could not connect to MySQL — check config.local.php.']);
    }
    ensureTables($pdo);
    return $pdo;
}

function ensureTables(PDO $pdo): void
{
    $pdo->exec("CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(190) NOT NULL UNIQUE,
        name VARCHAR(100) NOT NULL DEFAULT '',
        password_hash VARCHAR(255) NOT NULL DEFAULT '',
        google_sub VARCHAR(64) NULL,
        verified TINYINT(1) NOT NULL DEFAULT 0,
        verify_token VARCHAR(64) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $pdo->exec("CREATE TABLE IF NOT EXISTS tokens (
        token CHAR(64) PRIMARY KEY,
        user_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $pdo->exec("CREATE TABLE IF NOT EXISTS user_data (
        user_id INT PRIMARY KEY,
        state LONGTEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
}

function body(): array
{
    $raw = file_get_contents('php://input');
    $json = json_decode($raw ?: '', true);
    return is_array($json) ? $json : [];
}

function bearerToken(): ?string
{
    $hdr = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if ($hdr === '' && function_exists('getallheaders')) {
        foreach (getallheaders() as $k => $v) {
            if (strcasecmp($k, 'Authorization') === 0) {
                $hdr = $v;
            }
        }
    }
    return preg_match('/Bearer\s+([a-f0-9]{64})/i', $hdr, $m) ? strtolower($m[1]) : null;
}

function requireUser(): array
{
    $token = bearerToken();
    if ($token === null) {
        respond(401, ['error' => 'unauthorized']);
    }
    $st = db()->prepare('SELECT u.* FROM tokens t JOIN users u ON u.id = t.user_id WHERE t.token = ?');
    $st->execute([$token]);
    $user = $st->fetch(PDO::FETCH_ASSOC);
    if (!$user) {
        respond(401, ['error' => 'unauthorized']);
    }
    return $user;
}

function issueToken(int $userId): string
{
    $token = bin2hex(random_bytes(32));
    db()->prepare('INSERT INTO tokens (token, user_id) VALUES (?, ?)')->execute([$token, $userId]);
    return $token;
}

/** Real email validation: syntax AND the domain must be able to receive mail. */
function validateEmail(string $email): ?string
{
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        return 'That email address is not valid.';
    }
    $domain = substr(strrchr($email, '@') ?: '', 1);
    if ($domain === '' || !str_contains($domain, '.')) {
        return 'That email domain is not valid.';
    }
    if (function_exists('checkdnsrr') && !checkdnsrr($domain, 'MX') && !checkdnsrr($domain, 'A')) {
        return "The domain \"$domain\" cannot receive email — check for typos.";
    }
    return null;
}

function siteBase(): string
{
    $https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    return $https . '://' . ($_SERVER['HTTP_HOST'] ?? 'localhost');
}

/** Minimal SMTP client (STARTTLS or implicit TLS on 465, AUTH LOGIN) —
 *  mail() on shared hosting often claims success but never delivers. */
function smtpSend(string $to, string $subject, string $bodyTxt): bool
{
    global $SMTP_HOST, $SMTP_PORT, $SMTP_USER, $SMTP_PASS;
    $from = $SMTP_USER;
    $prefix = ((int)$SMTP_PORT === 465) ? 'ssl://' : 'tcp://';
    $fp = @stream_socket_client($prefix . $SMTP_HOST . ':' . $SMTP_PORT, $errno, $errstr, 12);
    if (!$fp) {
        return false;
    }
    stream_set_timeout($fp, 12);
    $read = function () use ($fp): string {
        $data = '';
        while (($line = fgets($fp, 515)) !== false) {
            $data .= $line;
            if (strlen($line) < 4 || $line[3] === ' ') {
                break;
            }
        }
        return $data;
    };
    $cmd = function (string $c) use ($fp, $read): string {
        fwrite($fp, $c . "\r\n");
        return $read();
    };
    try {
        $read();
        $cmd('EHLO studentify');
        if ((int)$SMTP_PORT !== 465) {
            if (!str_starts_with($cmd('STARTTLS'), '220')) {
                return false;
            }
            stream_socket_enable_crypto($fp, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
            $cmd('EHLO studentify');
        }
        $cmd('AUTH LOGIN');
        $cmd(base64_encode($SMTP_USER));
        if (!str_starts_with($cmd(base64_encode($SMTP_PASS)), '235')) {
            return false;
        }
        $cmd("MAIL FROM:<$from>");
        if (!str_starts_with($cmd("RCPT TO:<$to>"), '250')) {
            return false;
        }
        if (!str_starts_with($cmd('DATA'), '354')) {
            return false;
        }
        $msg = "From: Studentify <$from>\r\nTo: <$to>\r\nSubject: $subject\r\n"
            . "Content-Type: text/plain; charset=utf-8\r\n\r\n"
            . str_replace("\n.", "\n..", $bodyTxt) . "\r\n.";
        $ok = str_starts_with($cmd($msg), '250');
        $cmd('QUIT');
        return $ok;
    } finally {
        fclose($fp);
    }
}

function sendVerificationMail(string $email, string $token): bool
{
    global $SMTP_HOST, $SMTP_USER;
    $host = $_SERVER['HTTP_HOST'] ?? 'studentify.local';
    $link = siteBase() . '/api/verify.php?token=' . urlencode($token);
    $subject = 'Verify your Studentify account';
    $bodyTxt = "Welcome to Studentify!\n\nClick the link below to verify your email and activate your account:\n\n$link\n\nIf you didn't sign up, you can ignore this email.";
    if ($SMTP_HOST !== '' && $SMTP_USER !== '') {
        return smtpSend($email, $subject, $bodyTxt);
    }
    $headers = "From: Studentify <noreply@$host>\r\nContent-Type: text/plain; charset=utf-8";
    return @mail($email, $subject, $bodyTxt, $headers);
}
