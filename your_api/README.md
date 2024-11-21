# API for Djamo's exercice for Backend Engineer

This web server has been bootstrapped with `nest-cli`, using Typescript with `strict` mode by default.

# Developer's log

## 00. Setting up the development environment with docker compose

I believe docker should not be reserved for productiom, but also for development. A `git clone` followed by `docker compose up --watch` should be the norm. Alas, NestJS framework does not comes with a solution out the box. A bit of configuration has been necessery to ensure hot reload works.

## 01. Let's plan the first thing to work on

When talking to an API that is slow or failing, and we want the best end-user experience, the first thing to do is to introduce transactions states, store them, and add an API endpoint to have updates on these transactions.

 - our API should answer immediately with a `{ transactionId: XXX, status: created }` state for the transaction. That will leave the client not hanging, and he will be able to ask for updates with the transaction id at his will.
 - our API will asynchronously talk to the third party

In order to keep our backend stateless, we have to have a database for all the transactions. Thanks to docker we can quickly heavy lift a PostgresSQL datase. Just a DB without caching at first.

````
curl -H 'Content-Type: application/json' -X POST localhost:3100/transaction

curl -H 'Content-Type: application/json' localhost:3100/transaction/XXX
````

This should be a pretty good first unit of real work. Also, I want to scribble about Testing ! I love working by doing TDD, so I'll do that. I understand though that TDD in a startup environment could be seen as a hassle : and it's true. But in the long run it's really a practice that helps the software grows. Also it's a choice depending on the context : for instance if you have to have this backend as fast as possible maybe testing should not even be considered. So it's my choice to add Tests because I take this exercice as a way to work on my technical skills.

Before testing : I think it's really the responsability of the client to create a transaction Id. In this exercice the client looks like a backend, but, typicaly a  client is a web app or website. It's a matter of responsability. Sooooo I'm updating the `client` folder file ; I'm not sure I have the right to do that. But it seems pretty important. 

Instead of sending a `{ transactionId: XXX }`, the client will send `{ amount: XXX }` when creating a transaction. I've added :
 - `typestack/class-validator` library that provides slick decorators, so the DTO is easily understandable and has it's own logic
 - an end to end test : because testing the right format for the DTO, considering the NestJS context, could only be done that way.

Since our third party API is already a mock, I'll just focus on e2e tests.

Now it's time to initate a DB with a Dockerfile it will be quickly done I think. 




