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
        Schema::create('extraction_altimetrique', function (Blueprint $table) {
            $table->bigInteger('id')->primary();
            $table->bigInteger('metadata_id')->unique('extraction_altimetrique_metadata_id_key');
            $table->string('mnt', 150)->nullable();
            $table->string('resolution', 100)->nullable();
            $table->string('logiciel_utilise', 100)->nullable();
            $table->string('version_logiciel', 50)->nullable();
            $table->bigInteger('mode_extraction_id')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('extraction_altimetrique');
    }
};
