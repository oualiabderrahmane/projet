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
        Schema::create('collecte_preparation', function (Blueprint $table) {
            $table->bigInteger('id')->primary();
            $table->bigInteger('metadata_id')->unique('collecte_preparation_metadata_id_key');
            $table->unsignedBigInteger('operateur_id')->nullable();
            $table->date('date_debut')->nullable();
            $table->date('date_fin')->nullable();
            $table->string('imagerie', 150)->nullable();
            $table->string('resolution', 100)->nullable();
            $table->bigInteger('type_osm_id')->nullable();
            $table->integer('geonames_annee_mise_a_jour')->nullable();
            $table->string('gadm_version', 50)->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('collecte_preparation');
    }
};
