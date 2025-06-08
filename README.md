# Transaction Matching
This full stack web app matches "orders" with "transactions" with a focus on fuzzy matching.

## Usage

### Setup / Installation
Run the following from the root of the repository.
```
npm install
npm run build:all
```

### Running the Application
In two separate terminals, run the following to start the server and client code.
```
npm run start:server
npm run start:client
```

Similarly, to start them in dev mode, run the following (in separate terminals).
```
npm run dev:server
npm run dev:client
```

The server runs on port 3000 in either mode. The client runs on port 4173 in prod mode and 5173 in dev mode.

### Web UI
The UI allows you to build up sets of Orders and Transations, then match them when you're ready. The results will show up at the bottom of the screen. Note that each Transaction will have a Score column indiciating how good hte match was. (More on that below.)

The current data set is stored in cookies, so if you reload the page, you won't lose your work.

Notably, each Order will have a Generate Transaction button next to it, which will generate a Transaction that will *likely* be matched to that Order. All the common fields will be the same... except tweaked randomly with additions, subtractions, and visual-swaps.

### Swagger UI
If you want to test the API more directly, http://localhost:3000/docs hosts a Swagger UI.

### Large Request Generation
In order to test larger requests, you can run the following script.
```
npx ts-node scripts/generateRequest.ts
```

By default, this will generate an API request body containing 5 Orders and 30 Transactions per order, thus generating a file called `request_5x30.json`. 

You could paste the contents of that file into Swagger, or you could use a Curl command like the following.
```
curl -X POST "http://localhost:3000/api/match" -H "Content-Type: application/json" -d @request_50x30.json
```

To change how many Orders and Transactions are generated, tweak the `NUM_ORDERS` and `NUM_TRANSACTIONS_PER_ORDER` constants in the script. (The generated file's name will be change accordingly.)

## Design Notes

### Fuzzy Matching
When I looked for libraries that did inexact string comparisons, there were lots that could do case-insensitive fuzzy matching of actual characters present, but I didn't see any that could equate "visual" morphing, e.g. replacing `8` with `B`, as laid out in the challenge. So I ended up with a custom Levenshtein distance calculator that also used visually similar characters as slightly-less-than-perfect matches (with configurable weights).

It produces a score from 0 to 1, with 1 being a perfect match. I'm pretty happy with its behavior.

### Order-to-Transaction Matching & Scoring
Each Transaction is compared to each Order in order to determine how well it matches. They are scored 0 to 1, and the Order with whom the Transaction got the best score is the one they are matched with.

Determining the score between any given Order and Transaction is accomplished by performing a fuzzy match on each of the common fields (e.g. all but `txnType` and `txnAmount`) and summing those scores. Each field's individual score is then multiplied by a weight, so that different fields can be treated as "more important" than others. Finally, the sum of those weighted scores is divided by the sum of all the weights, resulting in a final score ranging from 0 to 1.

The non-string fields (of which there's only one, `price`) are converted to strings prior to comparison, so the closeness of the numerical values is largely irrelevant.

### Parallelization
The algorithm described above is `O(m*n)`, where `m` and `n` are the number of Orders and Transactions. Moreover, each pairing requires a whole bunch of string comparison, which is relatively expensive. In short, this is a very CPU-bound operation, 

Thus, I fanned out using worker threads. If each worker is given the full set of Orders (which, generally speaking, will be fewer than the number of Transactions), then parallelizing on Transactions is somewhat trivial by breaking them into batches. I spent a little time tuning the batch size and arrived at something that did well both with a single large request and with multiple, sustained sources of requests. (Performance will vary by machine and by one's definition of "large request", so in effect, the batch size is arbitrary.)

High level languages like TypeScript/JavaScript or Python do a lot better in IO-bound environments, where their relatively slow performance compared to compiled languages largely doesn't matter, and where they can take advantage of fancy semantics like async/await. If I were to implement this in a production environment, I'd want the bulk of the work done by a lower level language.

### Use of AI
I view AI as an accelerator and as an amazing way to bootstrap code when I haven't done something in a while - or ever. On this project, my primary uses of it were to help me with the modified Levenshtein distance algorithm and with the UI (which would otherwise have been a ton of busywork).

## Musings on Improvements
At the end of the day, I'm only going to spend a finite amount of time on this. Here are some thoughts on hypothetical improvements.

### Better Support for Missing Fields
Currently, _blank_ fields are entirely supported, but _missing_ fields are not. I made all the fields required in the Swagger schema, and that schema is enforced on the request body. This keeps the code simpler/cleaner, because I don't need a bunch of defensive checks for undefined, nor do I need to manually validate the inputs. (I'm a huge fan of defining things in one place!) However, this comes at the cost of flexibility. (Notably for the numeric fields, which can't even be "blank".)

### Deferred Request Parsing
As mentioned above, I take advantage of Swagger schema validation before control even reaches my code. However, for very large requests, this is expensive - notable because it's happening on the main thread, and because another (de)serialization step has to pass the information to the worker threads.

One idea I have that could handle this better is to not do any parsing of the body at all on the main thread and just treat it as a byte array. Pass _this_ to a worker thread, which would parse it. If the request ended up being large enough to be split into multiple batches, batches after the first could be passed to subsequent worker threads, while the original worker (that did the parsing) continues on to process the first batch.

### Persisting Data Prior to Match
Similar to how the UI lets you build up the request in memory, you could, conceptually, build up much larger requests by persisting the Orders and Transactions to a database of some kind first. This gets around having enormous requests and can also be more simply fanned out over multiple machines. If the request would be expected to take a while, it could start a "job" with an identifier that the client could check back in on.

The expected usage pattern would dictate what kind of persistent storage is used. If, for example, it's to behave basically like it does now, where each request is independent of any others, but on a larger scale, then something that supports fast and ephemeral data like Redis would be appropriate. Or, for example, if we need to compare Transactions to a historical set of Orders (in which case the number of orders might commonly be greater than the number of Transactions, opposite of what's assumed to be typical by my implementation!), you might want a more traditional database for the Orders and invert the batching to be based on those rather than Transactions. (Or simply fan out based on both, effectively batching on Order-Transaction pairs.)

### Heuristics
The matching algorithm is expensive. Especially when it has to be applied to every single Order. If you could quickly identify a high-scoring match, you might be able to avoid many of the full comparisons.

For example, if you built up a mapping of `orderId` to Order, and a given Transaction's `orderId` has an exact match in that mapping, then you could perform the full matching algorithm against _just_ that Order and, if its score met or exceed some very high threshold, then you could simply assign the Transaction to that Order with reasonable confidence and skip comparing it to all the others. This makes the best case computational complexity for a single Transaction `Ω(1)` (worst case is still `O(n)`), which does sound good, but the application of it is somewhat narrow - unless the "important" field is a LOT more important than the rest, you'd need a very high threshold to feel comfortable with the small risk of another Order matching so well in every other field that it actually would have scored better, if only we actually made the comparison.

Another strategy might be to make a partial pass on each Order, but compare only to a field (or fields) deemed to be of particular importance/influence (e.g. `orderId`). Then you can continue with full comparisons only of those that scored above some threshold on the important field(s) _first_. If the highest scoring Order within a batch scores high enough that it's numerically provable that the remaining Orders can't possibly achieve a higher score, then you can pick it and stop processing. For example, if `orderId` is worth 20% of the total sore, and you've already found an Order with a total score 0.9 for a given Transaction, then you can safely ignore any Orders whose `orderId` scored only .5 or below for that Transaction, as they can't possibly achieve a total higher than 0.9. This idea is certainly more complex to implement than the previous, and its best case complexity for a single Transaction is still `Ω(n)` with the number of Orders, but you can chop off a large percentage of useless string comparisons this way. As the total number of fields increases, the gains here increase linearly.