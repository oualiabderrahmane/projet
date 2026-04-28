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
        Schema::table('controle_niveaux', function (Blueprint $table) {
            $table->foreign(['controle_cartographique_id'], 'controle_niveaux_controle_cartographique_id_fkey')->references(['id'])->on('controle_cartographique')->onUpdate('no action')->onDelete('no action');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('controle_niveaux', function (Blueprint $table) {
            $table->dropForeign('controle_niveaux_controle_cartographique_id_fkey');
        });
    }
};
