<?php
require __DIR__ . '/config.php';

$token = bearerToken();
if ($token !== null) {
    db()->prepare('DELETE FROM tokens WHERE token = ?')->execute([$token]);
}
respond(200, ['ok' => true]);
