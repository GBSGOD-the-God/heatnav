<?php
require __DIR__ . '/config.php';

/** Site-wide AI tutor: proxies chat to Mistral using the OWNER's key from
 *  config.local.php. The key never reaches the browser. Per-user daily limit. */

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'GET') {
    respond(200, ['enabled' => $MISTRAL_API_KEY !== '']);
}
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    respond(405, ['error' => 'method']);
}
if ($MISTRAL_API_KEY === '') {
    respond(503, ['error' => 'ai-not-configured']);
}

// Identify the caller (logged-in user preferred, else IP) for rate limiting.
$who = 'ip:' . ($_SERVER['REMOTE_ADDR'] ?? 'unknown');
$token = bearerToken();
if ($token !== null) {
    $st = db()->prepare('SELECT user_id FROM tokens WHERE token = ?');
    $st->execute([$token]);
    $row = $st->fetch(PDO::FETCH_ASSOC);
    if ($row) {
        $who = 'user:' . $row['user_id'];
    }
}

$pdo = db();
$today = date('Y-m-d');
$pdo->prepare('INSERT INTO ai_usage (who, day, count) VALUES (?, ?, 1)
               ON DUPLICATE KEY UPDATE count = count + 1')->execute([$who, $today]);
$st = $pdo->prepare('SELECT count FROM ai_usage WHERE who = ? AND day = ?');
$st->execute([$who, $today]);
$used = (int)$st->fetchColumn();
if ($used > $AI_DAILY_LIMIT) {
    respond(429, [
        'error' => 'rate-limited',
        'message' => "Daily AI limit reached ($AI_DAILY_LIMIT messages). It resets at midnight — the offline engine still works meanwhile!",
    ]);
}

$in = body();
$messages = is_array($in['messages'] ?? null) ? $in['messages'] : [];
$mode = (string)($in['mode'] ?? 'homework');
$profile = is_array($in['profile'] ?? null) ? $in['profile'] : null;
$memory = is_array($in['memory'] ?? null) ? array_slice($in['memory'], -20) : [];
$length = (string)($in['length'] ?? 'balanced');

$modePrompts = [
    'homework' => "Homework Mode: guide, don't solve. Offer a hint first; give the full solution only when asked, always step by step.",
    'exam' => 'Exam Mode: concise, marks-oriented answers with definitions, formulas and the exact points an examiner awards marks for.',
    'doubt' => 'Quick Doubt: answer fast and directly, then one line of intuition.',
    'teach' => 'Teach Me: build the concept from zero with an everyday analogy, then the formal idea, one worked example, and finish by asking the student to explain it back.',
    'revision' => 'Revision: rapid recap — core idea in one sentence, the key formulas, the classic trap — then ask a recall question.',
    'challenge' => "Challenge Me: pose or answer questions one level above the student's grade. Be encouraging but do not dumb it down.",
];
$lengthRule = $length === 'short'
    ? 'Keep answers under 120 words.'
    : ($length === 'detailed'
        ? 'Be thorough — full derivations and extra examples are welcome.'
        : 'Keep answers focused; expand only where it aids understanding.');

$systemParts = [
    'You are Studentify, a warm, encouraging AI tutor for school students. Learning comes before answers: prefer guiding over telling. Use simple language, concrete examples and analogies. Use light structure (numbered steps, short paragraphs). Never be condescending.',
];
if ($profile && !empty($profile['grade'])) {
    $systemParts[] = 'Student: ' . ($profile['name'] ?? 'a student') . ', ' . $profile['grade'] . ', '
        . ($profile['board'] ?? '') . '. Adapt depth and vocabulary to this level. Subjects: '
        . implode(', ', $profile['subjects'] ?? []) . '.';
}
$systemParts[] = $modePrompts[$mode] ?? $modePrompts['homework'];
if ($memory) {
    $systemParts[] = 'What you remember about this student: ' . implode('; ', array_map('strval', $memory)) . '.';
}
$systemParts[] = $lengthRule;

$apiMessages = [['role' => 'system', 'content' => implode("\n\n", $systemParts)]];
foreach (array_slice($messages, -16) as $m) {
    if (!is_array($m) || !isset($m['text'])) {
        continue;
    }
    $apiMessages[] = [
        'role' => ($m['role'] ?? '') === 'ai' ? 'assistant' : 'user',
        'content' => (string)$m['text'],
    ];
}

$payload = json_encode([
    'model' => 'mistral-small-latest',
    'temperature' => 0.6,
    'max_tokens' => $length === 'detailed' ? 1400 : 700,
    'messages' => $apiMessages,
]);

$ch = curl_init('https://api.mistral.ai/v1/chat/completions');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 45,
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => $payload,
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $MISTRAL_API_KEY,
    ],
]);
$raw = curl_exec($ch);
$httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($raw === false || $httpCode >= 400) {
    respond(502, ['error' => 'mistral-error', 'message' => 'The AI service had a problem — try again in a moment.']);
}
$data = json_decode($raw, true);
$text = $data['choices'][0]['message']['content'] ?? '';
if ($text === '') {
    respond(502, ['error' => 'mistral-empty']);
}
respond(200, ['text' => $text, 'remaining' => max(0, $AI_DAILY_LIMIT - $used)]);
