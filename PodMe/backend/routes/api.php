<?php

use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\PetController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/ping', function () {
    return response()->json(['message' => 'pong from Laravel']);
});

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');

// apiResource wires index/store/show/update/destroy to conventional REST
// paths in one line — the equivalent of an Express router.route() block
// covering all five verbs at once. Per-record access is enforced in
// PetController via PetPolicy, not here.
Route::apiResource('pets', PetController::class)->middleware('auth:sanctum');
