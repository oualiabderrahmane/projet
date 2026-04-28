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
        Schema::create('redaction_cartographique', function (Blueprint $table) {
            $table->bigInteger('id')->primary();
            $table->bigInteger('metadata_id')->unique('redaction_cartographique_metadata_id_key');
            $table->string('logiciel_utilise', 100)->nullable();
            $table->string('version_logiciel', 50)->nullable();
            $table->string('equipement_id')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('redaction_cartographique');
    }
};
