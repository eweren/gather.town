Lighting
========

The scene graph can define specific layers as lighting layers which means these layers are illuminating all previous layers while ignoring the layers rendered on top of the corresponding lighting layer. So for example you can render the world, which is influenced by light, on layer 0, the lights on layer 1 and UI elements on layer 2 for example.

To mark a layer (or multiple layers) as lighting layer you have to call for example `scene.setLightingLayers([ 2 ])` in the game.

In Tiled you have to define a separate object layer and specify the custom property `layer` of type `int` with the corresponding layer number which should be used for lighting. In this layer you can define rectangles for ambient light, points for point lights and polygons for spot lights. All these objects must have the type `light` to be recognized as lights in the game.

The first created vertex of a spot light (polygon) defines the point from which the light illuminates.

Custom Properties
----------

Name            | Type  | Description
-----------------|-------|-------------
layer           | int   | Used on a layer in Tiled to define the layer within the scene graph
color           | color | Defines the light color of an object. Defaults to white if not specified.
intensity       | int   | Defines how strong/far the light shines. This influences the light gradient. Not used for ambient lights. Defaults to 100.
spin            | float | Only makes sense for spot lights. Defines how fast the light spins in degrees per second around the first vertex. Defaults to 0.
