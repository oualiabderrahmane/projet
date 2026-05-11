<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('collecte_preparation', function (Blueprint $table) {
            $table->string('geonames_annee_mise_a_jour', 150)->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('collecte_preparation', function (Blueprint $table) {
            $table->integer('geonames_annee_mise_a_jour')->nullable()->change();
        });
    }
};
