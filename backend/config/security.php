<?php

return [
    'pagination' => [
        'default_per_page' => 20,
        'max_per_page' => 100,
    ],

    'risk' => [
        /*
         * This threshold means elevated attention is required.
         * It does not automatically mean that an attack occurred.
         */
        'elevated_threshold' => 50,
    ],

    'overview' => [
        'default_days' => 30,
        'max_days' => 90,
    ],
];
