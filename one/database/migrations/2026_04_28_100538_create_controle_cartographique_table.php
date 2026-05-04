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
        Schema::create('controle_cartographique', function (Blueprint $table) {
            $table->bigInteger('id')->primary();
            $table->bigInteger('metadata_id')->unique('controle_cartographique_metadata_id_key');
            $table->bigInteger('type_controle_id')->nullable();
            $table->bigInteger('niveau_controle_id')->nullable();
            $table->unsignedBigInteger('operateur_id')->nullable();
            $table->date('date_debut')->nullable();
            $table->date('date_fin')->nullable();
            $table->date('date_controle')->nullable();
            $table->date('date_edition')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('controle_cartographique');
    }
};
