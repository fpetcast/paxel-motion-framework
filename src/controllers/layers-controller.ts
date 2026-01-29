import { Layer } from "../entities/layer";
import { IMotionParticle } from "../entities/particle";

class LayersController {
  private layers: Layer[] = [];
  private lookup: Map<string, number> = new Map();
  private active: string = "";

  list() {
    return this.layers.map((layer) => layer.name);
  }

  getAll() {
    return this.layers;
  }

  create(name: string) {
    if (this.layers.length === 0) {
      this.setActive(name);
    }

    const layer = new Layer({
      name,
      particles: [],
      visible: true,
    });

    this.layers.push(layer);
    this.lookup.set(name, this.layers.length - 1);

    return layer;
  }

  drop(name: string) {
    const dropLayerIndex = this.lookup.get(name) ?? -1;

    if (dropLayerIndex >= 0) {
      this.layers.splice(dropLayerIndex, 1);
      this.updateIndexesLookup(dropLayerIndex);
      this.lookup.delete(name);
      return dropLayerIndex;
    } else {
      console.error('Cannot find layer: ', name);
      return -1;
    }
  }

  updateIndexesLookup(fromLayerIndex: number) {
    this.lookup.forEach((layerIndex, layerName) => {
      if (layerIndex > fromLayerIndex) {
        this.lookup.set(layerName, --layerIndex);
      }
    });
  }

  changeOrder(
    name: string,
    toIndex: number
  ): void {
    const fromIndex = this.layers.findIndex(layer => layer.name === name);
    if (fromIndex === -1) return;
    if (toIndex < 0 || toIndex >= this.layers.length) return;
    if (fromIndex === toIndex) return;

    const layer = this.layers[fromIndex];

    if (fromIndex < toIndex) {
      for (let i = fromIndex; i < toIndex; i++) {
        this.layers[i] = this.layers[i + 1];
      }
    } else {
      for (let i = fromIndex; i > toIndex; i--) {
        this.layers[i] = this.layers[i - 1];
      }
    }

    this.layers[toIndex] = layer;
  }

  getByIndex(index: number) {
    return this.layers[index];
  }

  getById(_id: string) {
    const index = this.layers.findIndex((l) => l._id === _id);

    if (index >= 0) {
      return this.layers[index];
    }
  }

  getByName(name: string) {
    const layerIndex = this.lookup.get(name) ?? -1;

    if (layerIndex >= 0) {
      return this.layers[layerIndex];
    } else {
      console.warn('Cannot find layer: ', name);
      return undefined
    }
  }

  clearAll() {
    this.layers.forEach((layer) => {
      layer.lookup.clear();
      layer.particles = [];
    })
  }

  clear(name: string) {
    const layer = this.getByName(name);

    if (layer) {
      layer.lookup.clear();
      layer.particles = [];
    } else {
      console.error('Cannot clear layer: ', name);
    }
  }

  setActive(name: string) {
    this.active = name;
  }

  setVisible(name: string, visible: boolean) {
    const layer = this.getByName(name);

    if (layer) {
      layer.visible = visible;
    }
  }

  getActive() {
    return this.getByName(this.active) as Layer;
  }

  getParticles(filterOptions?: {
    excludeLayers?: string[],
    includeLayers?: string[],
  }) {
    return this.layers.reduce<IMotionParticle[]>((acc, layer) => {
      const name = layer.name;
      const notVisible = !this.isVisible(layer);

      let include = true;
      let exclude = false;

      if (filterOptions?.excludeLayers) {
        exclude = filterOptions.excludeLayers.includes(name) ? true : false;
      }

      if (filterOptions?.includeLayers) {
        include = filterOptions.includeLayers.includes(name) ? true : false;
      }

      if (notVisible || !include || exclude) {
        return acc;
      }

      acc = [
        ...acc,
        ...layer.particles.filter((particle) => particle.visible)
      ]
      return acc;
    }, [])
  }

  private isVisible(layer: Layer) {
    return layer.visible;
  }
}

export type ILayersController = InstanceType<typeof LayersController>;

export { LayersController };