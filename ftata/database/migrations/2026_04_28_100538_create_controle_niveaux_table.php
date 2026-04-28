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
        Schema::create('controle_niveaux', function (Blueprint $table) {
            $table->bigInteger('id')->primary();
            $table->bigInteger('controle_cartographique_id');
            $table->string('niveau_controle', 100)->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('controle_niveaux');
    }
};
