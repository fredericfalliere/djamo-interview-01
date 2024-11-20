# API for Djamo's exercice for Backend Engineer

This web server has been bootstrapped with `nest-cli`, using Typescript with `strict` mode by default.

# Developer's log

## 00. Setting up the development environment with docker compose

I believe docker should not be reserved for productiom, but also for development. A `git clone` followed by `docker compose up --watch` should be the norm. Alas, NestJS framework does not comes with a solution out the box. A bit of configuration has been necessery to ensure hot reload works.