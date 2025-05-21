<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

$host = 'localhost';
$dbname = 'whatsapp_sender';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Get POST data
    $data = json_decode(file_get_contents('php://input'), true);
    $action = $data['action'] ?? '';

    if ($action === 'register') {
        // Check if email already exists
        $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$data['email']]);
        if ($stmt->rowCount() > 0) {
            echo json_encode([
                'status' => 'error',
                'message' => 'Email already registered'
            ]);
            exit;
        }

        // Hash password
        $hashedPassword = password_hash($data['password'], PASSWORD_DEFAULT);

        // Insert new user
        $stmt = $pdo->prepare("INSERT INTO users (name, email, password) VALUES (?, ?, ?)");
        $stmt->execute([$data['name'], $data['email'], $hashedPassword]);

        echo json_encode([
            'status' => 'success',
            'message' => 'Registration successful'
        ]);
    }
    elseif ($action === 'login') {
        // Get user by email
        $stmt = $pdo->prepare("SELECT id, name, email, password FROM users WHERE email = ?");
        $stmt->execute([$data['email']]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user && password_verify($data['password'], $user['password'])) {
            // Remove password from user data
            unset($user['password']);
            
            echo json_encode([
                'status' => 'success',
                'message' => 'Login successful',
                'user' => $user
            ]);
        } else {
            echo json_encode([
                'status' => 'error',
                'message' => 'Invalid email or password'
            ]);
        }
    }
    else {
        echo json_encode([
            'status' => 'error',
            'message' => 'Invalid action'
        ]);
    }
} catch(PDOException $e) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?> 