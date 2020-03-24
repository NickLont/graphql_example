const express = require('express')
const { buildSchema } = require('graphql')
const graphqlHTTP = require('express-graphql')

// Making a schema, using GraphQL schema language
// All we need to do is to specify the types for our API using the GraphQL schema language, taken as an argument to the buildSchema function
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
  }
}

const app = express()
app.use('/graphql', graphqlHTTP({
  schema: schema,
  rootValue: root,
  graphiql: true
}))
// Since we configured graphqlHTTP with graphiql: true, you can use the GraphiQL tool to manually issue GraphQL queries.
app.listen(4000)
