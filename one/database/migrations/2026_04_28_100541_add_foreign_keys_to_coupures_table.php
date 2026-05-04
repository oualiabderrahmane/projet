<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('coupures', function (Blueprint $table) {
            $table->foreign(['feuille_id'], 'coupures_feuille_id_fkey')->references(['id'])->on('feuilles')->onUpdate('no action')->onDelete('no action');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('coupures', function (Blueprint $table) {
            $table->dropForeign('coupures_feuille_id_fkey');
        });
    }
};
