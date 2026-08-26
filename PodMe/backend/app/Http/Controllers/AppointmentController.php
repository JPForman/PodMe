<?php

namespace App\Http\Controllers;

use App\Http\Requests\Appointment\StoreAppointmentRequest;
use App\Models\Appointment;
use App\Models\Pet;
use App\Models\User;
use Illuminate\Http\Request;

class AppointmentController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', Appointment::class);

        $user = $request->user();

        $appointments = in_array($user->role, [User::ROLE_ADMIN, User::ROLE_EMPLOYEE], true)
            ? Appointment::with('pet.owner:id,name,email')->get()
            : Appointment::whereHas('pet', fn ($query) => $query->where('owner_id', $user->id))
                ->with('pet')
                ->get();

        return response()->json($appointments);
    }

    public function store(StoreAppointmentRequest $request)
    {
        $pet = Pet::findOrFail($request->validated('pet_id'));

        $this->authorize('create', [Appointment::class, $pet]);

        // status is left out of Fillable (see Appointment model), so it's
        // set via direct property assignment here rather than passed
        // through create()'s mass assignment.
        $appointment = new Appointment($request->safe()->only(['scheduled_at', 'reason']));
        $appointment->status = Appointment::STATUS_REQUESTED;
        $appointment->pet()->associate($pet);
        $appointment->save();

        return response()->json($appointment->load('pet.owner:id,name,email'), 201);
    }

    public function show(Appointment $appointment)
    {
        $this->authorize('view', $appointment);

        return response()->json($appointment->load('pet.owner:id,name,email'));
    }

    public function confirm(Appointment $appointment)
    {
        $this->authorize('confirm', $appointment);

        if ($appointment->status !== Appointment::STATUS_REQUESTED) {
            return response()->json([
                'message' => 'Only a requested appointment can be confirmed.',
            ], 422);
        }

        $appointment->status = Appointment::STATUS_CONFIRMED;
        $appointment->save();

        return response()->json($appointment->load('pet.owner:id,name,email'));
    }

    public function complete(Appointment $appointment)
    {
        $this->authorize('complete', $appointment);

        if ($appointment->status !== Appointment::STATUS_CONFIRMED) {
            return response()->json([
                'message' => 'Only a confirmed appointment can be completed.',
            ], 422);
        }

        $appointment->status = Appointment::STATUS_COMPLETED;
        $appointment->save();

        return response()->json($appointment->load('pet.owner:id,name,email'));
    }

    public function cancel(Appointment $appointment)
    {
        $this->authorize('cancel', $appointment);

        if (in_array($appointment->status, [Appointment::STATUS_COMPLETED, Appointment::STATUS_CANCELLED], true)) {
            return response()->json([
                'message' => 'This appointment can no longer be cancelled.',
            ], 422);
        }

        $appointment->status = Appointment::STATUS_CANCELLED;
        $appointment->save();

        return response()->json($appointment->load('pet.owner:id,name,email'));
    }
}
