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
        Schema::create('completement_spatial_type', function (Blueprint $table) {
    $table->foreignId('completement_spatial_id')
    ->constrained('completement_spatial')
    ->cascadeOnDelete();
    $table->foreignId('type_donnees_id')->constrained('types_donnees_spatiales')->cascadeOnDelete();

    $table->primary(['completement_spatial_id', 'type_donnees_id']);
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('completement_spatial_type');
    }
};
