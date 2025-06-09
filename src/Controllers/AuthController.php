<?php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Firebase\JWT\JWT;
use App\Models\User;

class AuthController extends BaseController
{
    public function register(Request $request, Response $response)
    {
        try {
            $data = json_decode($request->getBody()->getContents(), true);
            
            // Validate required fields
            if (empty($data['name']) || empty($data['email']) || empty($data['password'])) {
                throw new \Exception('Name, email and password are required');
            }

            // Check if user already exists
            if (User::where('email', $data['email'])->exists()) {
                throw new \Exception('User with this email already exists');
            }

            // Create new user
            $user = new User([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => password_hash($data['password'], PASSWORD_DEFAULT)
            ]);

            $user->save();

            // Generate JWT token
            $token = $this->generateToken($user);

            $response->getBody()->write(json_encode([
                'success' => true,
                'message' => 'Registration successful',
                'token' => $token,
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email
                ]
            ]));
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'error' => $e->getMessage()
            ]));
            return $response->withStatus(400);
        }

        return $response->withHeader('Content-Type', 'application/json');
    }

    public function login(Request $request, Response $response)
    {
        try {
            $data = json_decode($request->getBody()->getContents(), true);
            
            // Validate required fields
            if (empty($data['email']) || empty($data['password'])) {
                throw new \Exception('Email and password are required');
            }

            // Find user
            $user = User::where('email', $data['email'])->first();
            if (!$user || !password_verify($data['password'], $user->password)) {
                throw new \Exception('Invalid email or password');
            }

            // Generate JWT token
            $token = $this->generateToken($user);

            $response->getBody()->write(json_encode([
                'success' => true,
                'message' => 'Login successful',
                'token' => $token,
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email
                ]
            ]));
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'error' => $e->getMessage()
            ]));
            return $response->withStatus(400);
        }

        return $response->withHeader('Content-Type', 'application/json');
    }

    private function generateToken($user)
    {
        $payload = [
            'user_id' => $user->id,
            'email' => $user->email,
            'exp' => time() + (int)$_ENV['JWT_EXPIRATION'] // Use expiration from .env
        ];

        return JWT::encode($payload, $_ENV['JWT_SECRET'], 'HS256');
    }
} 