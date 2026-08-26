<?php

use App\Http\Controllers\AppointmentController;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\NoteController;
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

// Only index/store/show are generic REST — status changes are their own
// named actions (confirm/complete/cancel) rather than a catch-all update,
// so each transition can carry its own policy check and business rule.
Route::apiResource('appointments', AppointmentController::class)->only(['index', 'store', 'show'])->middleware('auth:sanctum');
Route::patch('/appointments/{appointment}/confirm', [AppointmentController::class, 'confirm'])->middleware('auth:sanctum');
Route::patch('/appointments/{appointment}/complete', [AppointmentController::class, 'complete'])->middleware('auth:sanctum');
Route::patch('/appointments/{appointment}/cancel', [AppointmentController::class, 'cancel'])->middleware('auth:sanctum');

// Notes are nested under their appointment (never a flat /notes resource)
// since they only ever make sense in the context of one visit — the same
// reasoning that keeps confirm/complete/cancel as their own routes rather
// than a generic update.
Route::get('/appointments/{appointment}/notes', [NoteController::class, 'index'])->middleware('auth:sanctum');
Route::post('/appointments/{appointment}/notes', [NoteController::class, 'store'])->middleware('auth:sanctum');
