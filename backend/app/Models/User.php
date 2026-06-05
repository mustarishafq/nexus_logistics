<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

#[Fillable(['name', 'email', 'password', 'role', 'is_approved'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_approved' => 'boolean',
        ];
    }

    public function toApiArray(): array
    {
        return [
            'id' => (string) $this->id,
            'full_name' => $this->name,
            'email' => $this->email,
            'role' => $this->role,
            'is_approved' => $this->is_approved,
            'created_date' => $this->created_at?->format('d/m/Y H:i'),
        ];
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }
}
