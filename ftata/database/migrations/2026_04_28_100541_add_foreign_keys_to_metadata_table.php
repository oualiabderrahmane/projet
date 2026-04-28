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
        Schema::table('metadata', function (Blueprint $table) {
            $table->foreign(['coupure_id'], 'metadata_coupure_id_fkey')->references(['id'])->on('coupures')->onUpdate('no action')->onDelete('no action');
            $table->foreign(['pays_id'], 'metadata_pays_id_fkey')->references(['id'])->on('pays')->onUpdate('no action')->onDelete('no action');
            $table->foreign(['systeme_reference_id'], 'metadata_systeme_reference_id_fkey')->references(['id'])->on('systemes_reference')->onUpdate('no action')->onDelete('no action');
            $table->foreign(['type_releve_id'], 'metadata_type_releve_id_fkey')->references(['id'])->on('types_releve')->onUpdate('no action')->onDelete('no action');
            $table->foreign('echelle_id')->references('id')->on('echelles')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('metadata', function (Blueprint $table) {
            $table->dropForeign('metadata_coupure_id_fkey');
            $table->dropForeign('metadata_pays_id_fkey');
            $table->dropForeign('metadata_systeme_reference_id_fkey');
            $table->dropForeign('metadata_type_releve_id_fkey');
        });
    }
};
