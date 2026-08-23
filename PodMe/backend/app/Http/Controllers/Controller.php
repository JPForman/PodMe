<?php

namespace App\Http\Controllers;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

/**
 * AuthorizesRequests adds $this->authorize('action', $model), which routes
 * to the matching Policy method (e.g. PetPolicy::update) and throws a 403
 * automatically on failure — the Laravel-native alternative to a hand-rolled
 * `if (!canDoThis) return res.status(403)` check in every handler.
 */
abstract class Controller
{
    use AuthorizesRequests;
}
