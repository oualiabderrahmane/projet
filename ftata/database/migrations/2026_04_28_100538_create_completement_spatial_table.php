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
        Schema::create('completement_spatial', function (Blueprint $table) {
            $table->bigInteger('id')->primary();
            $table->bigInteger('metadata_id')->unique('completement_spatial_metadata_id_key');
            $table->bigInteger('type_donnees_id')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('completement_spatial');
    }
};
