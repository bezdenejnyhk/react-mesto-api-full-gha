const Card = require('../models/card');
const { NotFoundError, ValidationError, ForbiddenError } = require('../errors');
// const { handleSucsessResponse } = require('../utils/handleSucsessResponse');

const createCard = (req, res, next) => {
  const { name, link } = req.body;
  const owner = req.user._id;
  return Card.create({ name, link, owner })
    .then((card) => res.status(201).send({ card }))
    .catch((err) => {
      if (err.name === 'ValidationError') {
        next(
          new ValidationError('Переданы некорректные данные при создании карточки.'),
        );
        return;
      }
      next(err);
    });
};

const getCards = (req, res, next) => {
  Card.find({})
    .populate(['owner', 'likes'])
    .then((cards) => res.send(cards))
    .catch(next);
};

const deleteCard = (req, res, next) => {
  const { cardId } = req.params;
  Card.findById(cardId)
    .then((card) => {
      if (!card) {
        throw new NotFoundError('Пользователь по указанному _id не найден');
      } else {
        const owner = card.owner.toString();
        if (req.user._id === owner) {
          Card.deleteOne(card).then(() => {
            res.send(card);
          });
          return;
        }
        next(new ForbiddenError('Чужие карточки удалить нельзя!'));
      }
    })
    .catch((err) => {
      if (err.name === 'CastError') {
        next(
          new ValidationError('Переданы некорректные данные для удаления карточки.'),
        );
        return;
      }
      next(err);
    });
};

const likeCard = (req, res, next) => {
  Card.findByIdAndUpdate(
    req.params.cardId,
    { $addToSet: { likes: req.user._id } },
    { new: true },
  )
    .populate(['owner', 'likes'])
    .then((card) => {
      if (!card) {
        next(new NotFoundError('Карточка с указанным _id не найдена.'));
      } else {
        res.send(card);
      }
    })
    .catch((err) => {
      if (err.name === 'CastError') {
        next(
          new ValidationError('Переданы некорректные данные для постановки лайка'),
        );
        return;
      }
      next(err);
    });
};

const dislikeCard = (req, res, next) => {
  Card.findByIdAndUpdate(
    req.params.cardId,
    { $pull: { likes: req.user._id } },
    { new: true },
  )
    .populate(['owner', 'likes'])
    .then((card) => {
      if (!card) {
        next(new NotFoundError('Карточка с указанным _id не найдена.'));
      } else {
        res.send(card);
      }
    })
    .catch((err) => {
      if (err.name === 'CastError') {
        next(new ValidationError('Переданы некорректные данные для снятия лайка'));
        return;
      }
      next(err);
    });
};

module.exports = {
  getCards,
  createCard,
  deleteCard,
  likeCard,
  dislikeCard,
};
