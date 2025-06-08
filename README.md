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
I view AI as an accelerator and as an amazing way to bootstrap code when I haven't done something in a while - or ever. On this project, my primary uses of it were to help me with the modified Levenshtein distance algorithm and with the UI.