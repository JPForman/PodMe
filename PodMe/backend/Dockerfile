# FrankenPHP bundles a PHP app server + web server into one binary, so a Laravel
# container doesn't need separately-configured nginx + php-fpm processes.
FROM dunglas/frankenphp:php8.4

RUN install-php-extensions pdo_pgsql opcache

WORKDIR /app

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
COPY . .
RUN composer install --no-dev --optimize-autoloader --no-interaction \
    && chown -R www-data:www-data storage bootstrap/cache

ENV SERVER_NAME=:8080
EXPOSE 8080

CMD ["frankenphp", "php-server", "--listen", ":8080", "--root", "/app/public"]
