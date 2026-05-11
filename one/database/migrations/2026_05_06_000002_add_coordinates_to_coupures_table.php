<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('coupures', function (Blueprint $table) {
            $table->string('latitude_nord', 50)->nullable()->after('nom');
            $table->string('longitude_ouest', 50)->nullable()->after('latitude_nord');
            $table->string('longitude_est', 50)->nullable()->after('longitude_ouest');
            $table->string('latitude_sud', 50)->nullable()->after('longitude_est');
        });
    }

    public function down(): void
    {
        Schema::table('coupures', function (Blueprint $table) {
            $table->dropColumn([
                'latitude_nord',
                'longitude_ouest',
                'longitude_est',
                'latitude_sud',
            ]);
        });
    }
};
