"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useCartStore } from "@/lib/store/cart-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Star, Heart, ShoppingBag, Minus, Plus, Truck } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";

interface ProductDetailProps {
  product: any;
}

export function ProductDetail({ product }: ProductDetailProps) {
  const router = useRouter();
  const { addItem } = useCartStore();
  const [selectedVar1Id, setSelectedVar1Id] = useState<string | null>(null);
  const [selectedVar2Id, setSelectedVar2Id] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const mainImage =
    product.images?.[selectedImageIndex] || product.images?.[0] || "";
  const images = product.images || [];

  const hasDiscount =
    product.discountPrice && product.discountPrice < product.price;
  const discountPercent = hasDiscount
    ? Math.round(
        ((product.price - product.discountPrice) / product.price) * 100,
      )
    : 0;

  // Group variants by type dynamically
  const variantGroups = useMemo(() => {
    const groups: Record<string, any[]> = {};
    if (product.variants) {
      for (const v of product.variants) {
        if (!groups[v.type]) groups[v.type] = [];
        groups[v.type].push(v);
      }
    }
    return groups;
  }, [product.variants]);

  const groupKeys = Object.keys(variantGroups);
  const hasVariants = groupKeys.length > 0;

  // Find matching combination
  const selectedCombination = useMemo(() => {
    if (!hasVariants || !product.combinations) return null;
    return product.combinations.find((c: any) => {
      if (groupKeys.length === 1) {
        return (
          c.variant1Id === (selectedVar1Id || selectedVar2Id) && !c.variant2Id
        );
      }
      return c.variant1Id === selectedVar1Id && c.variant2Id === selectedVar2Id;
    });
  }, [
    selectedVar1Id,
    selectedVar2Id,
    product.combinations,
    hasVariants,
    groupKeys.length,
  ]);

  const comboStock = selectedCombination?.stock ?? 0;
  const canAddToCart =
    !hasVariants ||
    (selectedVar1Id && (groupKeys.length === 1 || selectedVar2Id));
  const isOutOfStock = hasVariants
    ? canAddToCart && comboStock <= 0
    : product.stock <= 0;

  function getAvailableStock(): number {
    if (!hasVariants) return product.stock;
    if (!canAddToCart) return 0;
    return comboStock;
  }

  function handleAddToCart() {
    if (hasVariants && !canAddToCart) {
      toast.error("Pilih semua varian produk terlebih dahulu!");
      return;
    }
    if (getAvailableStock() <= 0) {
      toast.error("Stok produk habis!");
      return;
    }

    const var1 = selectedVar1Id
      ? variantGroups[groupKeys[0]]?.find((v: any) => v.id === selectedVar1Id)
      : null;
    const var2 =
      selectedVar2Id && groupKeys.length > 1
        ? variantGroups[groupKeys[1]]?.find((v: any) => v.id === selectedVar2Id)
        : null;

    addItem({
      id: `${product.id}-${selectedCombination?.id || ""}`,
      productId: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      discountPrice: product.discountPrice,
      image: product.images?.[0] || "",
      variantId: selectedVar1Id || selectedVar2Id || undefined,
      variantName: var1?.name || var2?.name || undefined,
      combinationId: selectedCombination?.id,
      quantity,
      weight: product.weight,
      stock: getAvailableStock(),
    });
    toast.success("Produk ditambahkan ke keranjang!");
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        {/* Image Section */}
        <div className="space-y-4">
          {/* Main Image */}
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted">
            {mainImage ? (
              <Image
                src={mainImage}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/30 bg-muted">
                Gambar tidak tersedia
              </div>
            )}
            {isOutOfStock && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
                <Badge className="bg-destructive text-destructive-foreground text-lg px-6 py-2">
                  Stok Habis
                </Badge>
              </div>
            )}
            {product.isFlashSale && (
              <Badge className="absolute top-4 left-4 bg-destructive text-destructive-foreground">
                Flash Sale
              </Badge>
            )}
          </div>

          {/* Image Thumbnails */}
          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-3">
              {images.map((image: string, index: number) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                    selectedImageIndex === index
                      ? "border-primary"
                      : "border-transparent hover:border-muted-foreground"
                  }`}
                >
                  <Image
                    src={image}
                    alt={`${product.name} - ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="100px"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              {product.category?.name}
            </p>
            <h1 className="text-2xl md:text-3xl font-heading font-bold">
              {product.name}
            </h1>
            <div className="flex items-center gap-2 mt-2">
              {/* <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium">4.8</span>
              </div> */}
              <span className="text-sm text-muted-foreground">
                ({product.soldCount ?? 0} terjual)
              </span>
            </div>
          </div>

          <div className="flex items-baseline gap-3">
            {hasDiscount ? (
              <>
                <span className="text-3xl font-bold">
                  {formatPrice(product.discountPrice)}
                </span>
                <span className="text-lg text-muted-foreground line-through">
                  {formatPrice(product.price)}
                </span>
                <Badge variant="destructive">-{discountPercent}%</Badge>
              </>
            ) : (
              <span className="text-3xl font-bold">
                {formatPrice(product.price)}
              </span>
            )}
          </div>

          <Separator />

          {product.materials && (
            <div>
              <h3 className="text-sm font-medium mb-1">Bahan</h3>
              <p className="text-sm text-muted-foreground">
                {product.materials}
              </p>
            </div>
          )}

          {/* Dynamic variant selectors */}
          {groupKeys.map((type, idx) => {
            const variants = variantGroups[type];
            const selectedId = idx === 0 ? selectedVar1Id : selectedVar2Id;
            const setSelectedId =
              idx === 0 ? setSelectedVar1Id : setSelectedVar2Id;

            return (
              <div key={type}>
                <h3 className="text-sm font-medium mb-2">{type}</h3>
                <div className="flex flex-wrap gap-2">
                  {variants.map((v: any) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedId(v.id)}
                      className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                        selectedId === v.id
                          ? "border-primary bg-primary/5 text-primary"
                          : "hover:border-muted-foreground"
                      }`}
                    >
                      {v.name}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}

          <div>
            <h3 className="text-sm font-medium mb-2">Jumlah</h3>
            <div className="flex items-center border rounded-lg w-fit">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="h-10 w-10 flex items-center justify-center"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-14 text-center font-medium">{quantity}</span>
              <button
                onClick={() =>
                  setQuantity(
                    Math.min(Math.max(getAvailableStock(), 1), quantity + 1),
                  )
                }
                className="h-10 w-10 flex items-center justify-center"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            {getAvailableStock() > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Stok: {getAvailableStock()}
              </p>
            )}
            {hasVariants && !canAddToCart && (
              <p className="text-xs text-muted-foreground mt-1">
                Pilih {groupKeys.join(" dan ")} terlebih dahulu
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              size="lg"
              className="flex-1 rounded-full gap-2"
              onClick={handleAddToCart}
              disabled={isOutOfStock || (hasVariants && !canAddToCart)}
            >
              <ShoppingBag className="h-5 w-5" />
              {isOutOfStock
                ? "Stok Habis"
                : hasVariants && !canAddToCart
                  ? "Pilih Varian"
                  : "Keranjang"}
            </Button>
            {/* <Button size="lg" variant="outline" className="rounded-full">
              <Heart className="h-5 w-5" />
            </Button> */}
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Truck className="h-4 w-4" />
            <span>Estimasi sampai dalam 3-5 hari kerja</span>
          </div>

          <Separator />

          <div>
            <h3 className="text-sm font-medium mb-2">Deskripsi Produk</h3>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {product.description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
