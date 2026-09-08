<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('qris_payments', function (Blueprint $table) {
            $table->id();
            $table->string('order_id', 50);
            $table->decimal('nominal', 15, 2);
            $table->string('qr_payload', 500)->nullable();
            $table->timestamp('expired_at');
            $table->enum('status', ['pending', 'paid', 'expired'])->default('pending');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('qris_payments');
    }
};
