/**
 * Thin client over the Azure Retail Prices API. Unauthenticated, per-region,
 * per-SKU. This is the only file in the package that touches the network.
 * https://learn.microsoft.com/en-us/rest/api/cost-management/retail-prices/azure-retail-prices
 */

export const RETAIL_API_VERSION = '2023-01-01-preview';
const BASE_URL = 'https://prices.azure.com/api/retail/prices';

/** One row of the retail price feed. Only the fields we consume are typed. */
export interface RetailItem {
  readonly meterId: string;
  readonly meterName: string;
  readonly skuName: string;
  readonly productName: string;
  readonly serviceName: string;
  readonly unitOfMeasure: string;
  readonly retailPrice: number;
  readonly armRegionName: string;
  readonly type: string;
  readonly currencyCode: string;
}

interface RetailPage {
  readonly Items: RetailItem[];
  readonly NextPageLink: string | null;
}

/** Fetches every page for one serviceName in one region. Follows NextPageLink
 * to exhaustion - a partial fetch would silently drop meters. */
export interface RetailClient {
  fetchService(serviceName: string, region: string): Promise<RetailItem[]>;
}

function filterUrl(serviceName: string, region: string): string {
  const filter = `serviceName eq '${serviceName}' and armRegionName eq '${region}'`;
  return `${BASE_URL}?api-version=${RETAIL_API_VERSION}&$filter=${encodeURIComponent(filter)}`;
}

/** Live client using the global fetch (Node 18+). */
export class HttpRetailClient implements RetailClient {
  async fetchService(serviceName: string, region: string): Promise<RetailItem[]> {
    const items: RetailItem[] = [];
    let url: string | null = filterUrl(serviceName, region);
    let guard = 0;
    while (url) {
      if (guard++ > 1000) throw new Error(`Retail feed: too many pages for ${serviceName}`);
      const res: Response = await fetch(url);
      if (!res.ok) {
        throw new Error(
          `Retail feed: ${serviceName} in ${region} returned HTTP ${res.status} ${res.statusText}`,
        );
      }
      const page = (await res.json()) as RetailPage;
      items.push(...page.Items);
      url = page.NextPageLink;
    }
    return items;
  }
}
