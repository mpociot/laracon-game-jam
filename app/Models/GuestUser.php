<?php

namespace App\Models;

use Illuminate\Contracts\Auth\Authenticatable;

class GuestUser implements Authenticatable
{
    public $id;
    public $name;
    
    public function __construct($id, $name)
    {
        $this->id = $id;
        $this->name = $name;
    }
    
    public function getAuthIdentifierName()
    {
        return 'id';
    }
    
    public function getAuthIdentifier()
    {
        return $this->id;
    }
    
    public function getAuthPassword()
    {
        return null;
    }
    
    public function getAuthPasswordName()
    {
        return 'password';
    }
    
    public function getRememberToken()
    {
        return null;
    }
    
    public function setRememberToken($value)
    {
        // Not implemented for guests
    }
    
    public function getRememberTokenName()
    {
        return 'remember_token';
    }
}