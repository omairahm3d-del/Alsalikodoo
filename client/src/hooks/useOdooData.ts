import { useState, useEffect, useCallback } from 'react';
import { useOdoo } from '@/contexts/OdooContext';
import type { Product, Partner, POSOrder } from '@/lib/odoo.types';

interface UseOdooDataOptions {
  limit?: number;
  offset?: number;
  domain?: any[];
}

interface UseOdooDataResult<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch products from Odoo
 */
export function useProducts(options?: UseOdooDataOptions): UseOdooDataResult<Product> {
  const { connector } = useOdoo();
  const [data, setData] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    if (!connector || !connector.isAuthenticated()) {
      setError('Not connected to Odoo');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await connector.searchRead('product.product',
        (options?.domain as any) || [],
        ['id', 'name', 'default_code', 'barcode', 'list_price', 'categ_id']
      );
      const products = result.records;
      setData(products);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch products';
      setError(errorMessage);
      console.error('Product fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [connector, options]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { data, loading, error, refetch: fetchProducts };
}

/**
 * Hook to fetch customers from Odoo
 */
export function useCustomers(options?: UseOdooDataOptions): UseOdooDataResult<Partner> {
  const { connector } = useOdoo();
  const [data, setData] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomers = useCallback(async () => {
    if (!connector || !connector.isAuthenticated()) {
      setError('Not connected to Odoo');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await connector.searchRead('res.partner', 
        options?.domain || [['customer_rank', '>', 0]],
        ['id', 'name', 'email', 'phone', 'mobile']
      );
      const customers = result.records;
      setData(customers);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch customers';
      setError(errorMessage);
      console.error('Customer fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [connector, options]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  return { data, loading, error, refetch: fetchCustomers };
}

/**
 * Hook to search products by name or barcode
 */
export function useSearchProducts(query: string): UseOdooDataResult<Product> {
  const { connector } = useOdoo();
  const [data, setData] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query || !connector || !connector.isAuthenticated()) {
      setData([]);
      return;
    }

    const searchProducts = async () => {
      setLoading(true);
      setError(null);

      try {
        const domain: [string, string, any][] = [
          ['|'],
          ['name', 'ilike', query],
          ['barcode', 'ilike', query],
        ] as any;

        const result = await connector.searchRead('product.product', domain, [
          'id',
          'name',
          'default_code',
          'barcode',
          'list_price',
          'categ_id',
        ]);

        setData(result.records as Product[]);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Search failed';
        setError(errorMessage);
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    };

    // Debounce search
    const timer = setTimeout(searchProducts, 300);
    return () => clearTimeout(timer);
  }, [query, connector]);

  return { data, loading, error, refetch: async () => {} };
}

/**
 * Hook to fetch product categories
 */
export function useProductCategories(): UseOdooDataResult<any> {
  const { connector } = useOdoo();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!connector || !connector.isAuthenticated()) {
      setError('Not connected to Odoo');
      return;
    }

    const fetchCategories = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await connector.searchRead('product.category', [] as any, [
          'id',
          'name',
          'parent_id',
        ]);
        setData(result.records);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch categories';
        setError(errorMessage);
        console.error('Category fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [connector]);

  return { data, loading, error, refetch: async () => {} };
}

/**
 * Hook to fetch taxes
 */
export function useTaxes(): UseOdooDataResult<any> {
  const { connector } = useOdoo();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!connector || !connector.isAuthenticated()) {
      setError('Not connected to Odoo');
      return;
    }

    const fetchTaxes = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await connector.searchRead('account.tax', [['active', '=', true]] as any, [
          'id',
          'name',
          'amount',
          'type_tax_use',
        ]);
        setData(result.records);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch taxes';
        setError(errorMessage);
        console.error('Tax fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTaxes();
  }, [connector]);

  return { data, loading, error, refetch: async () => {} };
}

/**
 * Hook to create a POS order
 */
export function useCreateOrder() {
  const { connector } = useOdoo();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createOrder = useCallback(
    async (orderData: any) => {
      if (!connector || !connector.isAuthenticated()) {
        setError('Not connected to Odoo');
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const orderId = await connector.create('pos.order', orderData);
        return orderId;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to create order';
        setError(errorMessage);
        console.error('Order creation error:', err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [connector]
  );

  return { createOrder, loading, error };
}

/**
 * Hook to get product stock information
 */
export function useProductStock(productId: number) {
  const { connector } = useOdoo();
  const [stock, setStock] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!productId || !connector || !connector.isAuthenticated()) {
      return;
    }

    const fetchStock = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await connector.searchRead('stock.quant', 
          [['product_id', '=', productId]] as any
        );
        setStock(result.records);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch stock';
        setError(errorMessage);
        console.error('Stock fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStock();
  }, [productId, connector]);

  return { stock, loading, error };
}
