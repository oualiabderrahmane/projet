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
        Schema::create('completement_spatial_type_donnee', function (Blueprint $table) {
            $table->bigInteger('completement_spatial_id');
            $table->unsignedBigInteger('type_donnees_id');

            $table->primary(
                ['completement_spatial_id', 'type_donnees_id'],
                'completement_spatial_type_donnee_primary'
            );

            $table->foreign('completement_spatial_id', 'cstd_completement_spatial_id_fkey')
                ->references('id')
                ->on('completement_spatial')
                ->cascadeOnDelete();

            $table->foreign('type_donnees_id', 'cstd_type_donnees_id_fkey')
                ->references('id')
                ->on('types_donnees_spatiales')
                ->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('completement_spatial_type_donnee');
    }
};
