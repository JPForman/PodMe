<?php

namespace App\Models;

use Database\Factories\AppointmentFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['scheduled_at', 'reason'])]
class Appointment extends Model
{
    /** @use HasFactory<AppointmentFactory> */
    use HasFactory;

    public const STATUS_REQUESTED = 'requested';

    public const STATUS_CONFIRMED = 'confirmed';

    public const STATUS_COMPLETED = 'completed';

    public const STATUS_CANCELLED = 'cancelled';

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'scheduled_at' => 'datetime',
        ];
    }

    /**
     * pet_id and status are deliberately left out of Fillable, same reasoning
     * as owner_id on Pet: pet_id is set explicitly by the controller after
     * an ownership check, and status only ever changes through the
     * confirm/complete/cancel endpoints below, never raw client input.
     */
    public function pet(): BelongsTo
    {
        return $this->belongsTo(Pet::class);
    }

    public function notes(): HasMany
    {
        return $this->hasMany(Note::class);
    }
}
