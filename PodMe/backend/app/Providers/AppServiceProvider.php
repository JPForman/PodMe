<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     *
     * Named rate limiters — Laravel 11+ moved these here since
     * RouteServiceProvider no longer exists. throttle:<name> in a route
     * definition (or throttleApi() on the whole 'api' group, see
     * bootstrap/app.php) references one of these by name, the same way
     * you'd name an express-rate-limit instance and mount it on a router.
     */
    public function boot(): void
    {
        // General API backstop, keyed by authenticated user else IP.
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
        });

        // Login: keyed by email+IP so one attacker email isn't lumped in
        // with everyone sharing an IP; hammering one IP against many
        // different emails is still capped by the 'api' limiter above.
        RateLimiter::for('login', function (Request $request) {
            return Limit::perMinute(5)->by(Str::lower((string) $request->input('email')).'|'.$request->ip());
        });

        // Registration: keyed by IP to slow bulk account creation.
        RateLimiter::for('register', function (Request $request) {
            return Limit::perMinute(5)->by($request->ip());
        });
    }
}
