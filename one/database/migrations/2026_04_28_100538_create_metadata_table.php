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
        Schema::create('metadata', function (Blueprint $table) {
            $table->bigInteger('id')->primary();
            $table->bigInteger('coupure_id');
            $table->bigInteger('pays_id')->nullable();
            $table->bigInteger('systeme_reference_id')->nullable();
            $table->bigInteger('type_releve_id')->nullable();
            $table->unsignedBigInteger('echelle_id')->nullable();
            $table->date('date_creation_metadata')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('metadata');
    }
};
