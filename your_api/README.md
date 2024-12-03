# API for Djamo's exercice for Backend Engineer

This web server has been bootstrapped with `nest-cli`, using Typescript with `strict` mode by default.

# Developer's log

## 00. Setting up the development environment with docker compose

I believe docker should not be reserved for productiom, but also for development. A `git clone` followed by `docker compose up --watch` should be the norm. Alas, NestJS framework does not comes with a solution out the box. A bit of configuration has been necessery to ensure hot reload works.

## 01. Let's plan the first day of work

When talking to an API that is slow or failing, and we want the best end-user experience, the first thing to do is to introduce transactions states, store them, and add an API endpoint to have updates on these transactions.

 - our API should answer immediately with a `{ transactionId: XXX, status: created }` state stored in our DB for the transaction. That will leave the client not hanging, and he will be able to ask for updates with the transaction id at his will.
 - our API will asynchronously talk to the third party, ideally using a persistent queue that is resilient to server crashes ; but in our case, we will simply not `await` for the third party call and return after that.

In order to keep our backend stateless, we have to have a database for all the transactions. Thanks to docker we can quickly heavy lift a PostgresSQL database.

This should be a pretty good first unit of real work. Also, I want to have a quick word about Testing ! I love working by doing TDD. I understand though that TDD in a startup environment could be seen as a hassle. But in the long run it's really a practice that helps the software grows. Also it's a choice depending on the context : for instance if you have to have this backend as fast as possible maybe testing should not even be considered. So it's my choice to add Tests because I also take this exercice as a way to work on my technical skills.

Before testing : I think it's really the responsability of the client to create a transaction Id. In this exercice the client looks like a backend, but, typicaly a  client is a web app or website. It's a matter of responsability. So I'm updating the `client` folder file ; I'm not sure I have the right to do that. But it seems pretty important.

Instead of sending a `{ transactionId: XXX }`, the client will send `{ amount: XXX }` when creating a transaction. I've added :
 - `typestack/class-validator` library that provides slick decorators, so the DTO is easily understandable and has it's own logic
 - an end to end test : because testing the right format for the DTO, considering the NestJS context, could only be done that way. Also this whole project seems unfitted for Unit Testing. Since our third party API is already a mock, I'll just focus on e2e tests.

Now it's time to initate a DB with a Dockerfile. That way a new developper coming to the project will have everything "plug and play".

Using prisma as ORM or not is the next question I'm pondering. For a real life project, the answer would be yes almost automaticly. However here, I'll have only 3 Sql queries ! But since this is a test project that also follows the classic Djamo's stack, I'm pretty sure they are using Prisma so I'll use it too.

A bit of refactor and it's the end of the day !

## 02. Testing the third party

In order to test all the cases, especially regarding the third party mock server, I decide to modify it. Tests are usually in 3 steps : `given` / `when` / `then`. Each test case should have, in the `given` paragraph, something that looks like this :

```
mockThirdParty.putWorkingConditions({
      shouldTimeout: true,
      shouldTimeoutAndWork: true,
      shouldSendWebhook: false,
    })
```

The crux of the matter here is to test our interactions with this third party API. If we don't do that, then to ensure all use cases are covered we would have to launch the one and only test we could write a big number of times. That does not seem like a good solution! I'm aware this will require a lot more time, but once it's set up, testing will be a breeze, also updating the mock server to cover new cases will also be easier, and I would sleep well knowing all cases are tightly covered. Also a good thing is since we are not mocking the service in our API, *actual* HTTP request are going through. From experience, handling then is not trivial : therefore, having them under the test laser beam is really good.

Actually the `workingConditions` should be passed directly into `HTTP Post /transaction` because otherzise the thirdParty state management would be hard to manage. It's simpler that way.

A caveat I only now see is about the webhook. Nest e2e tests with `supertest` only simulate an HTTP server. Meaning the webhook sent fron the thirdparty will never be received by our server. So that will have to be simulated in the test.

## 03. My toughts about remote work

So accross the span of a few days I've tried to work as if I was employed as a full-time remote employee. We have an 8 month old baby so it was hard for my wife to accept more than 1 full day of work ... when I'm not actually employed. We are actively looking for a nany.

I have an office space in the house so that was nice. I found out that working in the kitchen with the baby is almost impossible. Same as working and watching over baby. But the automated tests make it easier to have interuptions : you know what you have to do based on the tests results.

## 04. Back to testing

The next test to implement is the one where the server times out _and_ does actually work i.e. the transaction is stored in the third party server.

I'm questionning what would be a good timeout on our side. Because if the third party can timeout after 120seconds, I don't think it's a good idea to let a connexion open for that long. Actually I it's bad because it takes unnessessary resources for a long time.

So what should our behaviour concercing failed requests to the third party ? Usually, a failed request means, well, something failed. But here, somehow, it can fail, but still works. This is tricky because if we tell our client that the transaction failed, but it actually went through, the client will maybe try to resend the transaction and potentially loose the money two times. That's not acceptable. Actually how on earth a third party that handles money could work so badly ? Anyway in our case a solution would be to flag the transaction as `status: pending`, and ask the third party about our transaction after a certain amount of time, and update or status accordingly.

To check the status in case of an error after some time, `redis` is a good solution. It's a persisted queue of tasks. In case of timeout, or any other error for that matter, we could schedule a task to check the status with the api.

To manually test here is an example `curl` request

```
curl -H 'Content-Type: application/json' -d '{"amount":22, "workingConditions": { "shouldTimeout": true, "shouldTimeoutAndWork": true, "shouldSendWebhook": false } }' localhost:3200/transaction
```

## 05. Next case to test :  the webhook

Webhook testing may not be straightforward with this test stack. As I said above, e2e test only simulate our API http server. Incoming http request from third party's real http server will have nowhere to go. There is a solution however : we can stub that call inside the test.

A quick note about testing : for the previous test, about the timeout, I set the axios timeout to 5 seconds. And now I'm testing the webhook. But the webhook has lag, up to 30 seconds. In the section above of this developer's log I was writing that letting a connexion open for too long is bad. But how long is too long ? In other words, what is a good timeout time ?

`HttpModule.register({ timeout: ???? })`

The default is 5 seconds. Since we are using a third party that is really slow, we could bump it to 10 seconds. But ultimatly this decision would have to be mitigated after some production use : if too much request timeout, the timeout time should be decreased because it would be useless to wait.

The transaction returned can never be `pending`.


## 06. Another case : the third party drops the requests

It happens when it timeouts, the third party can decide to not store the transaction, therefore forgetting about it. The status check call would then return a 404. I don't know what would be the best thing to do : the client has been waiting for an update. We should not delete the transaction. Maybe we should simply tag the transaction as failed. The client will know its monney never left its wallet.

Automated tests with long timeout value is time consuming. I did change the values on the mock in our API to speed up the process. I will need to be extra careful not to commit these.

## 07. Improving the retry strategy

Our retry strategy only consists of one status check call, scheduled two minutes after a failed call to the third party. This means the client will have to wait *at least* 2 minutes before knowing if the transaction is completed, declined or failed. That is not acceptable.

Regarding calls to their status check API, in the spec it says

> they could block our services if we request it too often

What is too often ? In the current context, we don't know if we are blocked or not, and therefore no strategy can be choosen. Also, the status check concerns one transaction, what if they had an endpoint to check a pool of transactions... I'm going nowhere with this. Let's do with what we have and know.

In older versions of Gmail, there used to something similar when loosing Internet connexion. To check if the user is back online it used small increment at first, then bigger. The user still had the option to check manually. This is very similar to our case : since we don't know the rate limit or if there are quotas.

At first we use small intervals, like 1 seconds. After some time we progressivly increase by following Fibonaci or power of 2. The thresold, for a fast and responsive app should be IMHO 30 seconds. The intervals to call the status check API should be like this : `1s 1s 1s 1s 1s 1s 1s 1s 2s 3s 5s 8s 13s 21s 30s`. That way if the api is updated "fast" we lete our client know "fast" as well, but if it's longer, it will be longer for our client as well so nothing we can do here. Actually : we could let our client know that it is taking longer than expected, this will surely reassure him.

The test case for this is `shouldTimeout: true` and `shouldTimeoutAndWork: true` because for our retry strategy to be started, we need an error status code : the timeout. And the transaction needs to be not dropped.

```
curl -H 'Content-Type: application/json' -d '{"amount":25, "workingConditions": { "shouldTimeout": true, "shouldTimeoutAndWork": true } }' localhost:3200/transaction
```

This outlines an edge case I didn't encounter until now, easily visible with this improved retry strategy. It's the fact that the third party doesn't store the transaction as `pending`. It could take up to 120 seconds for the transaction to be stored. If not stored, our API, as of now, marks it as `abandon`.

There's a case where the third party *really* drops the transaction, without telling anyone. It's also in the timeout block. So we need the `abandon` status.

Could we maybe use the fact we know the third party can take up to 120 seconds to store the transaction ? And only the retries that fail *and* that happen after 120 seconds from initial retry should be marked as `abandon`. In the meantime, transactions should be marked as `pending`.

This solution seems really wobbly. What if this 120 seconds suddenly increases ? Transactions will be considered as `abandon`, and therefore the status check call will stop for them - but in truth they are still `pending`. 

## 08. Shared with Djamo

Time to share with Djamo :) I think I will keep working on this fun little project
