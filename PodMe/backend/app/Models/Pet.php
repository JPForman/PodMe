<?php

namespace App\Models;

use Database\Factories\PetFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['name', 'species', 'breed', 'date_of_birth', 'weight', 'notes'])]
class Pet extends Model
{
    /** @use HasFactory<PetFactory> */
    use HasFactory;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'date_of_birth' => 'date',
            'weight' => 'decimal:2',
        ];
    }

    /**
     * owner_id is deliberately left out of Fillable, same reasoning as
     * role on User: it must always be set explicitly by the controller
     * from the authenticated user, never from client-supplied input.
     */
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }
}
