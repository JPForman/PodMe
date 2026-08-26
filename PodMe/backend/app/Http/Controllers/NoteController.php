<?php

namespace App\Http\Controllers;

use App\Http\Requests\Note\StoreNoteRequest;
use App\Models\Appointment;
use App\Models\Note;

class NoteController extends Controller
{
    public function index(Appointment $appointment)
    {
        $this->authorize('view', $appointment);

        return response()->json(
            $appointment->notes()->with('author:id,name')->latest()->get()
        );
    }

    public function store(StoreNoteRequest $request, Appointment $appointment)
    {
        $this->authorize('create', [Note::class, $appointment]);

        $note = new Note($request->validated());
        $note->appointment()->associate($appointment);
        $note->author()->associate($request->user());
        $note->save();

        return response()->json($note->load('author:id,name'), 201);
    }
}
