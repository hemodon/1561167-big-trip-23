import { UpdateType } from '../const';
import Observable from '../framework/observable';

export default class TripModel extends Observable {
  #tripApiService = null;

  #points = [];
  #offers = [];
  #destinations = [];

  isServerUnavailable = false;

  constructor({ tripApiService }) {
    super();
    this.#tripApiService = tripApiService;
  }

  get points() {
    return this.#points;
  }

  get offers() {
    return this.#offers;
  }

  get destinations() {
    return this.#destinations;
  }

  init = async () => {
    try {
      const points = await this.#tripApiService.points;
      this.#points = points.map(this.#adaptToClient);

      this.#destinations = await this.#tripApiService.destinations;
      this.#offers = await this.#tripApiService.offers;
    } catch (error) {
      this.#points = [];
      this.#destinations = [];
      this.#offers = [];
      this.isServerUnavailable = true;
    }

    this._notify(UpdateType.INIT);
  };

  updatePoint = async (updateType, update) => {
    const index = this.#points.findIndex(({ id }) => id === update.id);

    if (index === -1) {
      throw new Error('Unable to update a non-existent point');
    }

    try {
      const response = await this.#tripApiService.updatedPoint(update);
      const updatedPoint = this.#adaptToClient(response);

      this.#points = [
        ...this.#points.slice(0, index),
        updatedPoint,
        ...this.#points.slice(index + 1),
      ];
      this._notify(updateType, updatedPoint);
    } catch (error) {
      throw new Error('The point cannot be updated');
    }
  };

  addPoint = async (updateType, update) => {
    try {
      const response = await this.#tripApiService.addPoint(update);
      const newPoint = this.#adaptToClient(response);

      this.#points = [newPoint, ...this.#points];
      this._notify(updateType, newPoint);
    } catch (error) {
      throw new Error('The point cannot be added');
    }
  };

  deletePoint = async (updateType, update) => {
    const index = this.#points.findIndex(({ id }) => id === update.id);

    if (index === -1) {
      throw new Error('Unable to delete a non-existent point');
    }

    try {
      this.#tripApiService.deletePoint(update);
      this.#points = [
        ...this.#points.slice(0, index),
        ...this.#points.slice(index + 1),
      ];

      this._notify(updateType);
    } catch (error) {
      throw new Error('This point cannot be deleted');
    }
  };

  #adaptToClient = (point) => {
    const adaptedPoint = {
      ...point,
      basePrice: point['base_price'],
      dateFrom:
        point['date_from'] !== null
          ? new Date(point['date_from'])
          : point['date_from'],
      dateTo:
        point['date_to'] !== null
          ? new Date(point['date_to'])
          : point['date_to'],
      isFavorite: point['is_favorite'],
    };

    delete adaptedPoint['base_price'];
    delete adaptedPoint['date_from'];
    delete adaptedPoint['date_to'];
    delete adaptedPoint['is_favorite'];

    return adaptedPoint;
  };
}
