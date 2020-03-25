const express = require('express')
const { buildSchema } = require('graphql')
const graphqlHTTP = require('express-graphql')

// Making a schema, using GraphQL schema language
// All we need to do is to specify the types for our API using the GraphQL schema language, taken as an argument to the buildSchema function
// In many cases, you will find a number of different mutations that all accept the same input parameters.
// To make your schema simpler, you can use “input types” for this, by using the input keyword instead of the type keyword.

const schema = buildSchema(`
  type RandomDie {
      numSides: Int!
      rollOnce: Int!
      roll(numRolls: Int!): [Int]
  }

  type Query {
    hello: String,
    quoteOfTheDay: String
    random: Float!
    rollThreeDice: [Int],
    rollDice(numDice: Int!, numSides: Int): [Int],
    getDie(numSides: Int): RandomDie
  }
`)

const mutationSchema = buildSchema(`
  input MessageInput {
    content: String
    author: String
  }

  type Message {
    id: ID!
    content: String
    author: String
  }

  type Query {
      getMessage(id: ID!): Message
  }

  type Mutation {
      createMessage(input: MessageInput): Message,
      updateMessage(id: ID!, input: MessageInput): Message
  }
`)

// Instead of a root-level resolver for the RandomDie type, we can instead use an ES6 class, where the resolvers are instance methods
// This class implements the RandomDie GraphQL type
class RandomDie {
  constructor (numSides) {
    this.numSides = numSides
  }

  rollOnce () {
    return 1 + Math.floor(Math.random() * this.numSides)
  }

  roll ({ numRolls }) {
    var output = []
    for (var i = 0; i < numRolls; i++) {
      output.push(this.rollOnce())
    }
    return output
  }
}

class Message {
  constructor (id, { content, author }) {
    this.id = id
    this.content = content
    this.author = author
  }
}

const fakeDatabase = {}

// The root provides a resolver function for each API endpoint
const root = {
  hello: () => {
    return 'Hello world!'
  },
  quoteOfTheDay: () => {
    return Math.random() < 0.5 ? 'Take it easy' : 'Salvation lies within'
  },
  random: () => {
    return Math.random()
  },
  rollThreeDice: () => {
    return [1, 2, 3].map(num => 1 + Math.floor(Math.random() * 6))
  },
  rollDice: (args) => {
    const { numDice, numSides } = args
    const output = []
    for (let i = 0; i < numDice; i++) {
      output.push(1 + Math.floor(Math.random() * (numSides || 6)))
    }
    return output
  },
  getDie: ({ numSides }) => {
    return new RandomDie(numSides || 6)
  },
  getMessage: ({ id }) => {
    if (!fakeDatabase[id]) {
      throw new Error('No message with that id: ', id)
    }
    return new Message(id, fakeDatabase[id])
  },
  createMessage: ({ input }) => {
    const id = require('crypto').randomBytes(10).toString('hex')
    fakeDatabase[id] = input
    return new Message(id, input)
  },
  updateMessage: ({ id, input }) => {
    if (!fakeDatabase[id]) {
      throw new Error('No message with that id: ', id)
    }
    fakeDatabase[id] = input
    return new Message(id, input)
  }
}

const app = express()
app.use('/graphql', graphqlHTTP({
  schema: schema,
  rootValue: root,
  graphiql: true
}))
app.use('/graphqlmutations', graphqlHTTP({
  schema: mutationSchema,
  rootValue: root,
  graphiql: true
}))
// Since we configured graphqlHTTP with graphiql: true, you can use the GraphiQL tool to manually issue GraphQL queries.
app.listen(4000)
