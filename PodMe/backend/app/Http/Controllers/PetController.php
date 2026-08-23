<?php

namespace App\Http\Controllers;

use App\Http\Requests\Pet\StorePetRequest;
use App\Http\Requests\Pet\UpdatePetRequest;
use App\Models\Pet;
use App\Models\User;
use Illuminate\Http\Request;

class PetController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', Pet::class);

        $user = $request->user();

        $pets = in_array($user->role, [User::ROLE_ADMIN, User::ROLE_EMPLOYEE], true)
            ? Pet::with('owner:id,name,email')->get()
            : $user->pets;

        return response()->json($pets);
    }

    public function store(StorePetRequest $request)
    {
        $this->authorize('create', Pet::class);

        $pet = $request->user()->pets()->create($request->validated());

        return response()->json($pet, 201);
    }

    public function show(Pet $pet)
    {
        $this->authorize('view', $pet);

        return response()->json($pet->load('owner:id,name,email'));
    }

    public function update(UpdatePetRequest $request, Pet $pet)
    {
        $this->authorize('update', $pet);

        $pet->update($request->validated());

        return response()->json($pet);
    }

    public function destroy(Pet $pet)
    {
        $this->authorize('delete', $pet);

        $pet->delete();

        return response()->json(['message' => 'Pet deleted.']);
    }
}
