FROM php:8.4-fpm

WORKDIR /var/www/html

RUN apt-get update && apt-get install -y \
    git unzip curl libzip-dev \
    poppler-utils \
    tesseract-ocr tesseract-ocr-jpn \
    && docker-php-ext-install pdo_mysql zip opcache \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

RUN { \
    echo 'opcache.enable=1'; \
    echo 'opcache.memory_consumption=128'; \
    echo 'opcache.interned_strings_buffer=8'; \
    echo 'opcache.max_accelerated_files=10000'; \
    echo 'opcache.validate_timestamps=1'; \
    echo 'opcache.jit_buffer_size=64m'; \
} > /usr/local/etc/php/conf.d/opcache.ini

RUN { \
    echo 'upload_max_filesize=30M'; \
    echo 'post_max_size=35M'; \
} > /usr/local/etc/php/conf.d/uploads.ini

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

COPY docker/php/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN sed -i 's/\r//' /usr/local/bin/entrypoint.sh && chmod +x /usr/local/bin/entrypoint.sh
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
