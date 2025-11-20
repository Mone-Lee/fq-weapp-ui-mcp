import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

const server = new McpServer({
  name: 'fq-weapp-ui-mcp',
  version: '0.1.0',
});

server.registerTool(
  'get-weather',
  {
    title: 'Get Weather Information',
    description: 'Get weather information for a given city',
    inputSchema: {
      city: z.string().describe('Name of the city to get weather for hahah'),
    },
  },
  async ({ city }) => {
    try {
      const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=10&language=en&format=json`);
      const data = await response.json();

      if (data.results.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `No results found for city: ${city}`
            }
          ]
        };
      }

      const { latitude, longitude } = data.results[0];
      const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,precipitation,apparent_temperature,relative_humidity_2m&forecast_days=1`);

      const weatherData = await weatherResponse.json();

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(weatherData, null, 2)
          }
        ]
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: "text",
            text: `Error fetching weather data: ${message}`
          }
        ]
      };
    }
  }
);

const transport = new StdioServerTransport();
server.connect(transport);
console.error('[mcp] server connected');