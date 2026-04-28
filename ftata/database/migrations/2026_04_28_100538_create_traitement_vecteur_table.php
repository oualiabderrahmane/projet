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
        Schema::create('traitement_vecteur', function (Blueprint $table) {
            $table->bigInteger('id')->primary();
            $table->bigInteger('metadata_id')->unique('traitement_vecteur_metadata_id_key');
            $table->string('logiciel_utilise', 100)->nullable();
            $table->string('version_logiciel', 50)->nullable();
            $table->bigInteger('mode_realisation_id')->nullable();
            $table->string('tolerance_topologique', 100)->nullable();
            $table->string('equipement_id')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('traitement_vecteur');
    }
};
