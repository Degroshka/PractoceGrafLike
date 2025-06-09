<?php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Models\Dashboard;
use App\Models\Panel;
use App\Models\DataSource;

class DashboardController extends BaseController
{
    public function index(Request $request, Response $response): Response
    {
        try {
            $token = $request->getHeaderLine('Authorization');
            if (empty($token)) {
                return $this->respondWithError($response, 'Authorization token is required', 401);
            }

            $token = str_replace('Bearer ', '', $token);
            $tokenParts = explode('.', $token);
            if (count($tokenParts) !== 3) {
                return $this->respondWithError($response, 'Invalid token format', 401);
            }

            $payload = json_decode(base64_decode($tokenParts[1]), true);
            if (!isset($payload['user_id'])) {
                return $this->respondWithError($response, 'User ID not found in token', 401);
            }

            $dashboards = Dashboard::where('user_id', $payload['user_id'])->get();
            return $this->respondWithData($response, $dashboards);
        } catch (\Exception $e) {
            return $this->respondWithError($response, $e->getMessage());
        }
    }

    public function show(Request $request, Response $response, array $args): Response
    {
        try {
            $dashboard = Dashboard::with('visualizations')->find($args['id']);
            if (!$dashboard) {
                return $this->respondWithError($response, 'Dashboard not found', 404);
            }

            return $this->respondWithData($response, $dashboard);
        } catch (\Exception $e) {
            return $this->respondWithError($response, $e->getMessage());
        }
    }

    public function create(Request $request, Response $response): Response
    {
        try {
            $data = $request->getParsedBody();
            
            // Validate required fields
            if (!isset($data['name'])) {
                return $this->respondWithError($response, 'Name is required', 400);
            }

            // Get user_id from token
            $token = $request->getHeaderLine('Authorization');
            if (empty($token)) {
                return $this->respondWithError($response, 'Authorization token is required', 401);
            }

            $token = str_replace('Bearer ', '', $token);
            $tokenParts = explode('.', $token);
            if (count($tokenParts) !== 3) {
                return $this->respondWithError($response, 'Invalid token format', 401);
            }

            $payload = json_decode(base64_decode($tokenParts[1]), true);
            if (!isset($payload['user_id'])) {
                return $this->respondWithError($response, 'User ID not found in token', 401);
            }

            $dashboard = new Dashboard();
            $dashboard->name = $data['name'];
            $dashboard->description = $data['description'] ?? null;
            $dashboard->user_id = $payload['user_id'];
            $dashboard->data_source_id = $data['data_source_id'] ?? null;
            $dashboard->config = json_encode(['panels' => []]);
            $dashboard->save();

            return $this->respondWithData($response, $dashboard, 201);
        } catch (\Exception $e) {
            error_log("Error creating dashboard: " . $e->getMessage());
            return $this->respondWithError($response, $e->getMessage());
        }
    }

    public function update(Request $request, Response $response, array $args): Response
    {
        try {
            $dashboard = Dashboard::find($args['id']);
            if (!$dashboard) {
                return $this->respondWithError($response, 'Dashboard not found', 404);
            }

            $data = $request->getParsedBody();
            $dashboard->fill($data);
            $dashboard->save();

            return $this->respondWithData($response, $dashboard);
        } catch (\Exception $e) {
            return $this->respondWithError($response, $e->getMessage());
        }
    }

    public function delete(Request $request, Response $response, array $args): Response
    {
        try {
            $dashboard = Dashboard::find($args['id']);
            if (!$dashboard) {
                return $this->respondWithError($response, 'Dashboard not found', 404);
            }

            $dashboard->delete();
            return $this->respondWithData($response, ['message' => 'Dashboard deleted successfully']);
        } catch (\Exception $e) {
            return $this->respondWithError($response, $e->getMessage());
        }
    }

    public function addPanel(Request $request, Response $response, array $args): Response
    {
        $data = $this->getRequestData($request);
        $userId = $request->getAttribute('user_id');

        $dashboard = Dashboard::where('id', $args['id'])
            ->where('user_id', $userId)
            ->first();

        if (!$dashboard) {
            return $this->errorResponse($response, 'Dashboard not found', 404);
        }

        if (!isset($data['title']) || !isset($data['type']) || !isset($data['query'])) {
            return $this->errorResponse($response, 'Title, type, and query are required');
        }

        $panel = new Panel();
        $panel->fill($data);
        $panel->dashboard_id = $dashboard->id;
        $panel->save();

        return $this->jsonResponse($response, [
            'message' => 'Panel added successfully',
            'panel' => $panel
        ], 201);
    }

    public function updatePanel(Request $request, Response $response, array $args): Response
    {
        $data = $this->getRequestData($request);
        $userId = $request->getAttribute('user_id');

        $panel = Panel::where('id', $args['panel_id'])
            ->whereHas('dashboard', function ($query) use ($userId) {
                $query->where('user_id', $userId);
            })
            ->first();

        if (!$panel) {
            return $this->errorResponse($response, 'Panel not found', 404);
        }

        $panel->fill($data);
        $panel->save();

        return $this->jsonResponse($response, [
            'message' => 'Panel updated successfully',
            'panel' => $panel
        ]);
    }

    public function deletePanel(Request $request, Response $response, array $args): Response
    {
        $userId = $request->getAttribute('user_id');
        $panel = Panel::where('id', $args['panel_id'])
            ->whereHas('dashboard', function ($query) use ($userId) {
                $query->where('user_id', $userId);
            })
            ->first();

        if (!$panel) {
            return $this->errorResponse($response, 'Panel not found', 404);
        }

        $panel->delete();

        return $this->jsonResponse($response, [
            'message' => 'Panel deleted successfully'
        ]);
    }

    public function getPanelData(Request $request, Response $response, array $args): Response
    {
        $userId = $request->getAttribute('user_id');
        $panel = Panel::where('id', $args['panel_id'])
            ->whereHas('dashboard', function ($query) use ($userId) {
                $query->where('user_id', $userId);
            })
            ->first();

        if (!$panel) {
            return $this->errorResponse($response, 'Panel not found', 404);
        }

        try {
            $data = $panel->executeQuery();
            return $this->jsonResponse($response, [
                'data' => $data
            ]);
        } catch (\Exception $e) {
            return $this->errorResponse($response, 'Failed to execute query: ' . $e->getMessage());
        }
    }
} 