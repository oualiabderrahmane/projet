<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('echelles', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('valeur', 50);
            $table->timestamps(); // optional but recommended
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('echelles');
    }
};
