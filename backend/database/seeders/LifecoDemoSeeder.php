<?php

namespace Database\Seeders;

use App\Models\Company;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use RuntimeException;

class LifecoDemoSeeder extends Seeder
{
    public function run(): void
    {
        $password = config('flowops.lifeco_demo_password');

        if (! is_string($password) || strlen($password) < 12) {
            throw new RuntimeException(
                'LIFECO_DEMO_PASSWORD must be configured and contain at least 12 characters.'
            );
        }

        $company = Company::updateOrCreate(
            [
                'code' => 'LIFECO',
            ],
            [
                'name' => 'Libyan Fertilizer Company',
                'email' => 'info@lifeco.com',
                'phone' => null,
                'website' => null,
                'logo' => null,
                'address' => 'Brega, Libya',
                'is_active' => true,
            ]
        );

        $user = User::updateOrCreate(
            [
                'email' => 'admin@lifeco.test',
            ],
            [
                'company_id' => $company->id,
                'name' => 'Shaheen Idris',
                'password' => Hash::make($password),
            ]
        );

        $user->syncRoles(['company_admin']);
    }
}