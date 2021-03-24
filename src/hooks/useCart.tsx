import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });


  const addProduct = async (productId: number) => {
    try {
      const { data } = await api.get(`stock/${productId}`);
      const stock: Stock = data;
      if (stock) {
        if (stock.amount <= 0) {
          toast.error('Quantidade solicitada fora de estoque');
        }

        const productInCart = cart.find(product => product.id === productId);
        if (productInCart && productInCart.amount <= stock.amount) {
          updateProductAmount({ productId: productInCart.id, amount: productInCart.amount + 1 });
        } else {
          const { data } = await api.get(`products/${productId}`);
          const product: Product = data;
          

          if (product) {
            setCart([...cart, { ...product, amount: 1 }]);

            localStorage.setItem(
              "@RocketShoes:cart",
              JSON.stringify([...cart, { ...product, amount: 1 }])
            );            
          }
        }
      }

    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productExists = cart.find((product) => product.id === productId)

      if (!productExists) throw new Error();
      const productsFiltered = cart.filter(product => product.id !== productId);
      setCart(productsFiltered);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(productsFiltered));
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount < 1) throw new Error();

      const { data } = await api.get(`stock/${productId}`);
      const stock: Stock = data;

      if (amount <= stock.amount) {
        const updatedCart = cart.map((product) =>
          product.id === productId ? { ...product, amount } : product
        );

        setCart(updatedCart);

        localStorage.setItem("@RocketShoes:cart", JSON.stringify(updatedCart));

      } else {
        toast.error("Quantidade solicitada fora de estoque");
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
